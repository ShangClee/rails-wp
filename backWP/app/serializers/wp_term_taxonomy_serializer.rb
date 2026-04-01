class WpTermTaxonomySerializer
  include JSONAPI::Serializer
  include WordpressSerializer

  set_id :term_taxonomy_id
  set_type :taxonomy

  attributes :taxonomy, :description, :count

  attribute :name do |object|
    object.term&.name
  end

  attribute :slug do |object|
    object.term&.slug
  end

  attribute :parent do |object|
    object.parent.to_i
  end

  attribute :children do |object|
    object.children.map do |child|
      {
        id: child.term_taxonomy_id,
        name: child.term&.name,
        slug: child.term&.slug,
        count: child.count
      }
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
