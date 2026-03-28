class UserRoleService
  VALID_ROLES = %w[administrator editor author contributor subscriber].freeze

  def initialize(user:, role:)
    @user = user
    @role = role.to_s.downcase
  end

  def assign_role
    unless VALID_ROLES.include?(@role)
      return { success: false, error: "Invalid role. Must be one of: #{VALID_ROLES.join(', ')}" }
    end

    begin
      # Create or update the wp_capabilities usermeta
      # Format: a:1:{s:N:"role_name";b:1;}
      capabilities_value = "a:1:{s:#{@role.length}:\"#{@role}\";b:1;}"

      usermeta = @user.metas.find_or_initialize_by(meta_key: 'wp_capabilities')
      usermeta.meta_value = capabilities_value
      usermeta.save!

      { success: true, user: @user, role: @role }
    rescue => e
      { success: false, error: e.message }
    end
  end
end
