class WpPageSerializer
  include JSONAPI::Serializer
  include WordpressSerializer

  set_id :ID
  set_type :page

  attributes :post_title, :post_content, :post_excerpt, :post_status, :post_date, :post_name, :post_type

  attribute :author do |object|
    {
      id: object.author&.ID,
      name: object.author&.display_name
    }
  end

  attribute :categories do |object|
    object.term_taxonomies.categories.map do |tax|
      {
        id: tax.term.term_id,
        name: tax.term.name,
        slug: tax.term.slug
      }
    end
  end

  attribute :tags do |object|
    object.term_taxonomies.tags.map do |tax|
      {
        id: tax.term.term_id,
        name: tax.term.name,
        slug: tax.term.slug
      }
    end
  end

  attribute :meta do |object|
    object.metas.each_with_object({}) do |meta, hash|
      hash[meta.meta_key] = meta.meta_value unless meta.meta_key.start_with?("_")
    end
  end

  def serialize
    # Check if _embed parameter is present in the context
    embed = @instance_options&.dig(:params, :_embed) == "true"

    # Check if _fields parameter is present for field filtering
    fields_param = @instance_options&.dig(:params, :_fields)
    requested_fields = if fields_param.present?
      fields_param.split(",").map(&:strip)
    else
      nil
    end

    # Get the full data
    data = to_wordpress_format(nil, embed: embed)

    # If fields are specified, filter the data
    if requested_fields.present?
      # Always include id as it's required
      requested_fields << "id" unless requested_fields.include?("id")
      data.slice(*requested_fields)
    else
      data
    end
  end
end
