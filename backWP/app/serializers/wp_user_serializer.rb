class WpUserSerializer
  include JSONAPI::Serializer
  include WordpressSerializer

  set_id :ID
  set_type :user

  attributes :user_login, :user_nicename, :user_email, :display_name, :user_registered, :user_url

  attribute :roles do |object|
    object.role
  end

  attribute :meta do |object|
    object.metas.each_with_object({}) do |meta, hash|
      hash[meta.meta_key] = meta.meta_value unless meta.meta_key.start_with?('_')
    end
  end

  def serialize
    # Check if _embed parameter is present in the context
    embed = @instance_options&.dig(:params, :_embed) == "true"
    
    # Check if _fields parameter is present for field filtering
    fields_param = @instance_options&.dig(:params, :_fields)
    requested_fields = if fields_param.present?
      fields_param.split(',').map(&:strip)
    else
      nil
    end
    
    # Get the full data
    data = to_wordpress_format(nil, embed: embed)
    
    # If fields are specified, filter the data
    if requested_fields.present?
      # Always include id as it's required
      requested_fields << 'id' unless requested_fields.include?('id')
      data.slice(*requested_fields)
    else
      data
    end
  end
end

  attribute :meta do |object|
    object.metas.each_with_object({}) do |meta, hash|
      hash[meta.meta_key] = meta.meta_value unless meta.meta_key.start_with?("_")
    end
  end

  def serialize
    to_wordpress_format
  end
end
