module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [Types::NodeType, null: true], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ID], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # Posts
    field :posts, [Types::WpPostType], null: false do
      argument :limit, Integer, required: false, default_value: 10
      argument :offset, Integer, required: false, default_value: 0
    end

    def posts(limit:, offset:)
      WpPost.published.posts.recent.limit(limit).offset(offset)
    end

    field :post, Types::WpPostType, null: true do
      argument :id, ID, required: true
    end

    def post(id:)
      WpPost.find(id)
    end

    # Admin posts (all statuses, auth-gated)
    field :admin_posts, [Types::WpPostType], null: false do
      argument :limit, Integer, required: false, default_value: 20
      argument :offset, Integer, required: false, default_value: 0
      argument :status, String, required: false
    end

    def admin_posts(limit:, offset:, status: nil)
      user = context[:current_user]
      return [] unless user&.admin? || user&.editor?

      scope = WpPost.posts.recent.limit(limit).offset(offset)
      scope = scope.where(post_status: status) if status.present?
      scope
    end

    # Pages
    field :pages, [Types::WpPageType], null: false

    def pages
      WpPost.pages.recent
    end

    # Users
    field :users, [Types::WpUserType], null: false

    def users
      WpUser.all
    end

    field :viewer, Types::WpUserType, null: true

    def viewer
      context[:current_user]
    end

    # Taxonomies
    field :categories, [Types::WpTermTaxonomyType], null: false

    def categories
      WpTermTaxonomy.categories
    end

    field :tags, [Types::WpTermTaxonomyType], null: false

    def tags
      WpTermTaxonomy.tags
    end
  end
end
