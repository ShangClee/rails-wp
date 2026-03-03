# bin/verify_models.rb
puts "Verifying WpUser..."
puts "User Count: #{WpUser.count}"
if user = WpUser.first
  puts "First User: #{user.user_login}"
  puts "User Meta Count: #{user.metas.count}"
end

puts "\nVerifying WpPost..."
puts "Post Count: #{WpPost.count}"
if post = WpPost.first
  puts "First Post: #{post.post_title}"
  puts "Post Author: #{post.author&.user_login}"
  puts "Post Meta Count: #{post.metas.count}"
end

puts "\nVerifying WpOption..."
puts "Option Count: #{WpOption.count}"
puts "Site URL: #{WpOption.get('siteurl')}"
puts "Blog Name: #{WpOption.get('blogname')}"

puts "\nVerifying WpTerm..."
puts "Term Count: #{WpTerm.count}"
if term = WpTerm.first
  puts "First Term: #{term.name}"
  if taxonomy = term.term_taxonomy
    puts "Taxonomy: #{taxonomy.taxonomy}"
    puts "Post Count in Term: #{taxonomy.posts.count}"
  end
end

puts "\nVerifying WpComment..."
puts "Comment Count: #{WpComment.count}"
if comment = WpComment.first
  puts "First Comment: #{comment.comment_content}"
  puts "Comment Post: #{comment.post.post_title}"
end
