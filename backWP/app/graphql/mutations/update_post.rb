module Mutations
  class UpdatePost < GraphQL::Schema::Mutation
    argument :id, ID, required: true
    argument :title, String, required: false
    argument :content, String, required: false
    argument :excerpt, String, required: false
    argument :status, String, required: false

    field :post, Types::WpPostType, null: true
    field :errors, [String], null: true

    def resolve(id:, title: nil, content: nil, excerpt: nil, status: nil)
      unless context[:current_user]
        return { post: nil, errors: ['Unauthorized'] }
      end

      post = WpPost.find(id)
      unless post
        return { post: nil, errors: ['Post not found'] }
      end

      params = {}
      params[:post_title] = title if title.present?
      params[:post_content] = content if content.present?
      params[:post_excerpt] = excerpt if excerpt.present?
      params[:post_status] = status if status.present?

      service = PostService.new(current_user: context[:current_user])
      result = service.update(post, params)

      if result[:success]
        { post: result[:post], errors: [] }
      else
        { post: nil, errors: [result[:error]] }
      end
    end
  end
end
