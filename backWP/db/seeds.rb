# db/seeds.rb

puts "Seeding WordPress Data..."

# 1. Create Default Options
WpOption.create!([
  { option_name: 'siteurl', option_value: 'http://localhost:3000', autoload: 'yes' },
  { option_name: 'home', option_value: 'http://localhost:3000', autoload: 'yes' },
  { option_name: 'blogname', option_value: 'My Rails WP Site', autoload: 'yes' },
  { option_name: 'blogdescription', option_value: 'Just another WordPress site', autoload: 'yes' },
  { option_name: 'users_can_register', option_value: '0', autoload: 'yes' },
  { option_name: 'admin_email', option_value: 'admin@example.com', autoload: 'yes' },
  { option_name: 'start_of_week', option_value: '1', autoload: 'yes' },
  { option_name: 'use_balanceTags', option_value: '0', autoload: 'yes' },
  { option_name: 'use_smilies', option_value: '1', autoload: 'yes' },
  { option_name: 'require_name_email', option_value: '1', autoload: 'yes' },
  { option_name: 'comments_notify', option_value: '1', autoload: 'yes' },
  { option_name: 'posts_per_page', option_value: '10', autoload: 'yes' },
  { option_name: 'date_format', option_value: 'F j, Y', autoload: 'yes' },
  { option_name: 'time_format', option_value: 'g:i a', autoload: 'yes' },
  { option_name: 'links_updated_date_format', option_value: 'F j, Y g:i a', autoload: 'yes' },
  { option_name: 'comment_moderation', option_value: '0', autoload: 'yes' },
  { option_name: 'moderation_notify', option_value: '1', autoload: 'yes' },
  { option_name: 'permalink_structure', option_value: '/%year%/%monthnum%/%day%/%postname%/', autoload: 'yes' },
  { option_name: 'rewrite_rules', option_value: '', autoload: 'yes' }
])

# 2. Create Admin User
admin = WpUser.create!(
  user_login: 'admin',
  password: 'password', # Devise will hash this to user_pass (BCrypt)
  user_nicename: 'admin',
  user_email: 'admin@example.com',
  user_url: 'http://localhost:3000',
  user_registered: Time.now,
  user_activation_key: '',
  user_status: 0,
  display_name: 'admin'
)

# Admin Meta
WpUsermeta.create!([
  { user_id: admin.ID, meta_key: 'wp_capabilities', meta_value: 'a:1:{s:13:"administrator";b:1;}' },
  { user_id: admin.ID, meta_key: 'wp_user_level', meta_value: '10' },
  { user_id: admin.ID, meta_key: 'nickname', meta_value: 'admin' },
  { user_id: admin.ID, meta_key: 'first_name', meta_value: 'Admin' },
  { user_id: admin.ID, meta_key: 'last_name', meta_value: 'User' }
])

# 3. Create Default Category (Uncategorized)
uncat_term = WpTerm.create!(name: 'Uncategorized', slug: 'uncategorized', term_group: 0)
uncat_tax = WpTermTaxonomy.create!(
  term_id: uncat_term.term_id,
  taxonomy: 'category',
  description: '',
  parent: 0,
  count: 1
)

# 4. Create "Hello World" Post
hello_post = WpPost.create!(
  post_author: admin.ID,
  post_date: Time.now,
  post_date_gmt: Time.now.utc,
  post_content: 'Welcome to WordPress. This is your first post. Edit or delete it, then start writing!',
  post_title: 'Hello world!',
  post_excerpt: '',
  post_status: 'publish',
  comment_status: 'open',
  ping_status: 'open',
  post_password: '',
  post_name: 'hello-world',
  to_ping: '',
  pinged: '',
  post_modified: Time.now,
  post_modified_gmt: Time.now.utc,
  post_content_filtered: '',
  post_parent: 0,
  guid: 'http://localhost:3000/?p=1',
  menu_order: 0,
  post_type: 'post',
  post_mime_type: '',
  comment_count: 1
)

# Assign Category to Post
WpTermRelationship.create!(
  object_id: hello_post.ID,
  term_taxonomy_id: uncat_tax.term_taxonomy_id,
  term_order: 0
)

# Post Meta
WpPostmeta.create!([
  { post_id: hello_post.ID, meta_key: '_wp_page_template', meta_value: 'default' }
])

# 5. Create Sample Page
sample_page = WpPost.create!(
  post_author: admin.ID,
  post_date: Time.now,
  post_date_gmt: Time.now.utc,
  post_content: 'This is an example page. It differs from a blog post because it will stay in one place and will show up in your site navigation (in most themes).',
  post_title: 'Sample Page',
  post_excerpt: '',
  post_status: 'publish',
  comment_status: 'open',
  ping_status: 'open',
  post_password: '',
  post_name: 'sample-page',
  to_ping: '',
  pinged: '',
  post_modified: Time.now,
  post_modified_gmt: Time.now.utc,
  post_content_filtered: '',
  post_parent: 0,
  guid: 'http://localhost:3000/?page_id=2',
  menu_order: 0,
  post_type: 'page',
  post_mime_type: '',
  comment_count: 0
)

# 6. Create Comment on Hello World
WpComment.create!(
  comment_post_ID: hello_post.ID,
  comment_author: 'A WordPress Commenter',
  comment_author_email: 'wapuu@wordpress.example',
  comment_author_url: 'https://wordpress.org/',
  comment_author_IP: '127.0.0.1',
  comment_date: Time.now,
  comment_date_gmt: Time.now.utc,
  comment_content: 'Hi, this is a comment. To get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.',
  comment_karma: 0,
  comment_approved: '1',
  comment_agent: 'Mozilla/5.0',
  comment_type: 'comment',
  comment_parent: 0,
  user_id: 0
)

puts "Seeding Completed!"
