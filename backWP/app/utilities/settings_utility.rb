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
