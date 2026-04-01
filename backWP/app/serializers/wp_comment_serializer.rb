class WpCommentSerializer
  include JSONAPI::Serializer
  include WordpressSerializer

  set_id :comment_ID
  set_type :comment

  attributes :comment_author, :comment_author_email, :comment_content, :comment_date,
             :comment_approved, :comment_parent

  attribute :post_id do |object|
    object.comment_post_ID
  end

  attribute :user_id do |object|
    object.user_id
  end

  attribute :author_name do |object|
    object.user ? object.user.display_name : object.comment_author
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

  attribute :user_id do |object|
    object.user_id
  end

  attribute :author_name do |object|
    object.user ? object.user.display_name : object.comment_author
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
