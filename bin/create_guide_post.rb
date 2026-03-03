# bin/create_guide_post.rb
puts "Creating 'WP Deep Agent Guide' post..."

# 1. Create Category 'AI Agent' if not exists
term = WpTerm.find_or_create_by!(name: 'AI Agent', slug: 'ai-agent')
term_taxonomy = WpTermTaxonomy.find_or_create_by!(term_id: term.term_id, taxonomy: 'category') do |t|
  t.description = ''
  t.parent = 0
  t.count = 0
end
puts "Category 'AI Agent' ready (ID: #{term_taxonomy.term_taxonomy_id})"

# 2. Create Post
post = WpPost.create!(
  post_title: 'WP Deep Agent 가이드 (비공개)',
  post_content: <<~CONTENT,
    # WordPress 전용 Special Subagent를 LangChain + DeepAgents로 만드는 완전 가이드

    **hanmitravel.dothome.co.kr**을 **자동 관리하는 Deep Agent**를 만듭니다. **Subagent들이 협업**하며 WP REST API 호출합니다.

    [... 추가 내용은 추후 업데이트 예정 ...]
  CONTENT
  post_status: 'private', # 비공개
  post_author: 1, # Admin
  post_type: 'post',
  comment_status: 'closed',
  ping_status: 'closed',
  post_name: 'wp-deep-agent-guide'
)

# 3. Assign Category
WpTermRelationship.create!(
  object_id: post.ID,
  term_taxonomy_id: term_taxonomy.term_taxonomy_id
)

puts "Post created successfully!"
puts "ID: #{post.ID}"
puts "Title: #{post.post_title}"
puts "Status: #{post.post_status}"
puts "URL: http://localhost:3000/api/v2/posts/#{post.ID}"
