module SettingsUtility
  # Whitelist of allowed setting keys (matching WordPress conventions)
  ALLOWED_KEYS = %w[
    blogname
    blogdescription
    siteurl
    home
    admin_email
    timezone_string
    date_format
    time_format
    posts_per_page
    default_comment_status
    comment_moderation
    comment_registration
    close_comments_for_old_posts
    close_comments_days_old
    thread_comments
    thread_comments_depth
    comments_per_page
    default_ping_status
    use_smilies
    page_on_front
    page_for_posts
    show_on_front
    blog_public
    permalink_structure
    upload_path
    uploads_use_yearmonth_folders
  ].freeze

  # Fetch all allowed settings from WpOption
  def self.fetch_all
    WpOption.where(option_name: ALLOWED_KEYS)
            .each_with_object({}) do |option, hash|
              hash[option.option_name] = option.option_value
            end
  end

  # Update multiple settings atomically
  def self.update_all(params)
    params.slice(*ALLOWED_KEYS).each do |key, value|
      WpOption.find_or_initialize_by(option_name: key).update!(option_value: value)
    end
  end
end
