module Types
  class WpTermTaxonomyType < Types::BaseObject
    field :term_taxonomy_id, ID, null: false
    field :taxonomy, String, null: false
    field :description, String, null: true
    field :count, Integer, null: false
    field :parent, Integer, null: false
    
    field :name, String, null: true
    field :slug, String, null: true
    
    def name
      object.term&.name
    end

    def slug
      object.term&.slug
    end
  end
end
