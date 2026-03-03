#!/usr/bin/env ruby
require 'net/http'
require 'json'
require 'uri'

BASE_URL = "http://localhost:3000"
API_V2_URL = "#{BASE_URL}/api/v2"
GRAPHQL_URL = "#{BASE_URL}/graphql"

def log(msg, type = :info)
  color = case type
          when :success then "\e[32m" # Green
          when :error then "\e[31m"   # Red
          when :info then "\e[34m"    # Blue
          else "\e[0m"
          end
  puts "#{color}[#{type.to_s.upcase}] #{msg}\e[0m"
end

def request(method, path, body = nil, token = nil)
  uri = URI("#{BASE_URL}#{path}")
  http = Net::HTTP.new(uri.host, uri.port)
  
  req = case method
        when :get then Net::HTTP::Get.new(uri)
        when :post then Net::HTTP::Post.new(uri)
        when :delete then Net::HTTP::Delete.new(uri)
        end
  
  req['Content-Type'] = 'application/json'
  req['Authorization'] = "Bearer #{token}" if token
  req.body = body.to_json if body

  http.request(req)
end

puts "=== Phase 7: System Verification ==="

# 1. Authentication
log "1. Testing Authentication..."
auth_response = request(:post, "/api/v2/login", { wp_user: { email: 'admin@example.com', password: 'password' } })

if auth_response.code == '200'
  log "Authentication Successful", :success
  json = JSON.parse(auth_response.body)
  TOKEN = json['token']
else
  log "Authentication Failed: #{auth_response.body}", :error
  exit 1
end

# 2. REST API: Create Post
log "2. Testing Create Post..."
post_data = {
  post: {
    post_title: "Phase 7 Verification Post",
    post_content: "This is a test post created during verification.",
    post_status: "publish"
  }
}
create_response = request(:post, "/api/v2/posts", post_data, TOKEN)

if create_response.code == '201'
  log "Create Post Successful", :success
  post_json = JSON.parse(create_response.body)
  POST_ID = post_json['data']['id']
else
  log "Create Post Failed: #{create_response.body}", :error
  exit 1
end

# 3. REST API: Read Post
log "3. Testing Read Post..."
read_response = request(:get, "/api/v2/posts/#{POST_ID}", nil, TOKEN)

if read_response.code == '200'
  log "Read Post Successful", :success
else
  log "Read Post Failed: #{read_response.body}", :error
  exit 1
end

# 4. GraphQL API
log "4. Testing GraphQL Query..."
graphql_query = {
  query: <<~GQL
    query {
      posts(limit: 1) {
        postTitle
        author {
          userLogin
        }
      }
    }
  GQL
}
gql_response = request(:post, "/graphql", graphql_query, TOKEN)

if gql_response.code == '200'
  gql_json = JSON.parse(gql_response.body)
  if gql_json['data']['posts'].is_a?(Array)
    log "GraphQL Query Successful", :success
  else
    log "GraphQL Query returned unexpected structure: #{gql_json}", :error
    exit 1
  end
else
  log "GraphQL Query Failed: #{gql_response.body}", :error
  exit 1
end

# 5. REST API: Delete Post
log "5. Testing Delete Post..."
delete_response = request(:delete, "/api/v2/posts/#{POST_ID}", nil, TOKEN)

if delete_response.code == '204'
  log "Delete Post Successful", :success
else
  log "Delete Post Failed: #{delete_response.body}", :error
  exit 1
end

# 6. Redis Health Check (via Rails Runner)
log "6. Testing Redis Connection..."
# We will verify this by checking if the Rails cache can write/read
redis_check = `docker compose exec web bundle exec rails runner "Rails.cache.write('ping', 'pong'); puts Rails.cache.read('ping')"`

if redis_check.strip == 'pong'
  log "Redis Connection Successful", :success
else
  log "Redis Connection Failed: #{redis_check}", :error
  exit 1
end

log "=== Verification Completed Successfully ===", :success
