class WpPostSerializer
  include JSONAPI::Serializer

  set_id :ID
  set_type :post

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
      hash[meta.meta_key] = meta.meta_value unless meta.meta_key.start_with?('_')
    end
  end
end
