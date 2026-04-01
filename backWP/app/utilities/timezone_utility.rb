module TimezoneUtility
  # Get the site's timezone from settings, fallback to UTC if not set
  def self.site_timezone
    timezone_string = SettingsUtility.fetch_all["timezone_string"]
    if timezone_string.present?
      begin
        ActiveSupport::TimeZone[timezone_string] || UTC
      rescue
        UTC
      end
    else
      UTC
    end
  end

  # Convert current time to site's timezone for WordPress post_date
  def self.now_local
    site_timezone.now
  end

  # Get current UTC time for WordPress post_date_gmt
  def self.now_utc
    Time.now.utc
  end

  # Convert a time to site's timezone
  def self.to_local_time(time)
    time.in_time_zone(site_timezone)
  end

  # Convert a time to UTC
  def self.to_utc_time(time)
    time.utc
  end
end
