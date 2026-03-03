namespace :wordpress do
  desc "Export Posts to JSON"
  task export_posts_json: :environment do
    require 'json'
    
    file_path = Rails.root.join('tmp', "posts_export_#{Time.now.to_i}.json")
    posts = WpPost.published.includes(:metas, :author, term_taxonomies: :term).limit(1000) # Limit for safety
    
    data = posts.map do |post|
      WpPostSerializer.new(post).serializable_hash[:data][:attributes]
    end
    
    File.write(file_path, JSON.pretty_generate(data))
    puts "Exported #{posts.count} posts to #{file_path}"
  end

  desc "Export Users to CSV"
  task export_users_csv: :environment do
    require 'csv'
    
    file_path = Rails.root.join('tmp', "users_export_#{Time.now.to_i}.csv")
    users = WpUser.all
    
    CSV.open(file_path, "w") do |csv|
      csv << ["ID", "Login", "Email", "Display Name", "Registered At", "Role"]
      
      users.each do |user|
        csv << [
          user.ID,
          user.user_login,
          user.user_email,
          user.display_name,
          user.user_registered,
          user.role
        ]
      end
    end
    
    puts "Exported #{users.count} users to #{file_path}"
  end

  desc "Import Posts from JSON (Simple)"
  task import_posts_json: :environment do
    file_path = ENV['FILE']
    unless file_path && File.exist?(file_path)
      puts "Please provide a valid FILE environment variable."
      exit
    end

    json_data = JSON.parse(File.read(file_path))
    
    ActiveRecord::Base.transaction do
      json_data.each do |post_data|
        # This is a simplified import. In reality, you'd need to handle IDs, authors, etc. carefully.
        post = WpPost.new(
          post_title: post_data['post_title'],
          post_content: post_data['post_content'],
          post_status: 'draft', # Import as draft for safety
          post_author: 1, # Default to admin for now
          post_date: Time.now,
          post_date_gmt: Time.now.utc,
          post_modified: Time.now,
          post_modified_gmt: Time.now.utc,
          post_type: 'post',
          comment_status: 'closed',
          ping_status: 'closed',
          post_name: post_data['post_title'].parameterize
        )
        
        if post.save
          puts "Imported post: #{post.post_title}"
        else
          puts "Failed to import post: #{post.post_title} - #{post.errors.full_messages.join(', ')}"
        end
      end
    end
  end
end
