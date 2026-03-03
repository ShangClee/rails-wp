require 'net/http'
require 'json'
require 'uri'
require 'base64'
require 'openssl'

# Configuration
WP_URL = ENV.fetch('WP_URL', 'https://hanmitravel.dothome.co.kr')
WP_USERNAME = ENV['WP_USERNAME']
WP_APP_PASSWORD = ENV['WP_APP_PASSWORD'] || ENV['WP_PASSWORD']
CATEGORY_NAME = ENV.fetch('WP_CATEGORY_NAME', 'AI Agent')
CATEGORY_SLUG = ENV.fetch('WP_CATEGORY_SLUG', 'ai-agent')

# Parse Arguments
if ARGV.empty?
  puts "Usage: ruby bin/post_to_remote_wp.rb <path_to_markdown_file> [title]"
  puts "Env: WP_URL=... WP_USERNAME=... WP_APP_PASSWORD=... (optional: WP_CATEGORY_NAME, WP_CATEGORY_SLUG, WP_INSECURE_SSL=1)"
  exit 1
end

CONTENT_FILE = ARGV[0]
unless File.exist?(CONTENT_FILE)
  puts "Error: File '#{CONTENT_FILE}' not found."
  exit 1
end

missing_env = []
missing_env << 'WP_USERNAME' if WP_USERNAME.to_s.strip.empty?
missing_env << 'WP_APP_PASSWORD' if WP_APP_PASSWORD.to_s.strip.empty?
if missing_env.any?
  puts "Error: Missing env: #{missing_env.join(', ')}"
  puts "Example: WP_URL=#{WP_URL} WP_USERNAME=... WP_APP_PASSWORD=... rails runner bin/post_to_remote_wp.rb #{CONTENT_FILE}"
  exit 1
end

def titleize_filename(filename)
  filename.to_s.tr('_-', ' ').split.map { |w| w[0] ? (w[0].upcase + w[1..-1].to_s.downcase) : w }.join(' ')
end

# Use provided title or derive from filename/content
TITLE = if ARGV[1]
          ARGV[1]
        else
          # Try to find first H1 header in markdown, else use filename
          content_first_line = File.foreach(CONTENT_FILE).first.to_s.strip
          if content_first_line.start_with?('# ')
            content_first_line.sub('# ', '')
          else
            titleize_filename(File.basename(CONTENT_FILE, ".*"))
          end
        end

def request(method, path, params: nil, body: nil)
  base = URI(WP_URL)
  uri = URI(base.to_s)
  uri.path = base.path.to_s.sub(%r{/\z}, '') + path
  uri.query = URI.encode_www_form(params) if params

  http = Net::HTTP.new(uri.host, uri.port)
  if uri.scheme == 'https'
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE if ENV['WP_INSECURE_SSL'] == '1'
  end

  req_class = { get: Net::HTTP::Get, post: Net::HTTP::Post }.fetch(method)
  req = req_class.new(uri)

  auth = Base64.strict_encode64("#{WP_USERNAME}:#{WP_APP_PASSWORD}")
  req['Authorization'] = "Basic #{auth}"
  req['Content-Type'] = 'application/json'
  req.body = body.to_json if body

  http.request(req)
end

puts "=== Posting to Remote WordPress: #{WP_URL} ==="
puts "File: #{CONTENT_FILE}"
puts "Title: #{TITLE}"

puts "Checking authentication..."
me_res = request(:get, "/wp-json/wp/v2/users/me")
if me_res.code != '200'
  puts "Authentication failed: #{me_res.code} #{me_res.body}"
  exit 1
end
me = JSON.parse(me_res.body)
puts "Authenticated as: #{me['name']} (ID #{me['id']})"

# 1. Get/Create Category
puts "Checking category '#{CATEGORY_NAME}'..."
cat_res = request(:get, "/wp-json/wp/v2/categories", params: { slug: CATEGORY_SLUG })

category_id = nil

if cat_res.code == '200'
  categories = JSON.parse(cat_res.body)
  if categories.empty?
    puts "Category not found. Creating..."
    create_cat_res = request(:post, "/wp-json/wp/v2/categories", body: { name: CATEGORY_NAME, slug: CATEGORY_SLUG })
    if create_cat_res.code == '201'
      category_id = JSON.parse(create_cat_res.body)['id']
      puts "Category created: ID #{category_id}"
    else
      puts "Failed to create category: #{create_cat_res.code} #{create_cat_res.body}"
      exit 1
    end
  else
    category_id = categories.first['id']
    puts "Category found: ID #{category_id}"
  end
else
  puts "Failed to fetch categories: #{cat_res.code} #{cat_res.body}"
  exit 1
end

if category_id
  # 2. Read Content
  content = File.read(CONTENT_FILE)

  # 3. Create Post
  puts "Creating Post..."
  post_data = {
    title: TITLE,
    content: content,
    status: 'private', 
    categories: [category_id]
  }

  post_res = request(:post, "/wp-json/wp/v2/posts", body: post_data)

  if post_res.code == '201'
    post = JSON.parse(post_res.body)
    puts "=== Post Created Successfully ==="
    puts "ID: #{post['id']}"
    puts "Link: #{post['link']}"
    puts "Status: #{post['status']}"
    puts "Edit URL: #{WP_URL}/wp-admin/post.php?post=#{post['id']}&action=edit"
  else
    puts "Failed to create post: #{post_res.code} #{post_res.body}"
    exit 1
  end
end
