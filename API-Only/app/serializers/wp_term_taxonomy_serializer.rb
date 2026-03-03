class WpTermTaxonomySerializer
  include JSONAPI::Serializer

  set_id :term_taxonomy_id
  set_type :taxonomy

  attributes :taxonomy, :description, :count

  attribute :name do |object|
    object.term&.name
  end

  attribute :slug do |object|
    object.term&.slug
  end

  attribute :parent_id do |object|
    object.parent
  end
end
