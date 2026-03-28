module Mutations
  class CreatePost < GraphQL::Schema::Mutation
    argument :title, String, required: true
    argument :content, String, required: false
    argument :excerpt, String, required: false
    argument :status, String, required: false

    field :post, Types::WpPostType, null: true
    field :errors, [String], null: true

    def resolve(title:, content: '', excerpt: '', status: 'draft')
      unless context[:current_user]
        return { post: nil, errors: ['Unauthorized'] }
      end

      service = PostService.new(current_user: context[:current_user])
      result = service.create(
        post_title: title,
        post_content: content,
        post_excerpt: excerpt,
        post_status: status
      )

      if result[:success]
        { post: result[:post], errors: [] }
      else
        { post: nil, errors: [result[:error]] }
      end
    end
  end
end
