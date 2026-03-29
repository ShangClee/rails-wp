module Types
  class WpPageType < Types::BaseObject
    field :ID, ID, null: false
    field :post_title, String, null: true
    field :post_content, String, null: true
    field :post_excerpt, String, null: true
    field :post_status, String, null: true
    field :post_name, String, null: true
    field :post_parent, Integer, null: true
    field :menu_order, Integer, null: true
    field :post_date, GraphQL::Types::ISO8601DateTime, null: true

    field :author, Types::WpUserType, null: true
  end
end
