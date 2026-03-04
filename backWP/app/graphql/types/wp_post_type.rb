module Types
  class WpPostType < Types::BaseObject
    field :ID, ID, null: false
    field :post_title, String, null: true
    field :post_content, String, null: true
    field :post_excerpt, String, null: true
    field :post_status, String, null: true
    field :post_date, GraphQL::Types::ISO8601DateTime, null: true
    field :post_name, String, null: true
    field :post_type, String, null: true
    
    field :author, Types::WpUserType, null: true
    field :categories, [Types::WpTermTaxonomyType], null: true
    field :tags, [Types::WpTermTaxonomyType], null: true
    
    def categories
      object.term_taxonomies.categories
    end

    def tags
      object.term_taxonomies.tags
    end
  end
end
