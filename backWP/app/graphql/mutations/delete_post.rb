module Mutations
  class DeletePost < GraphQL::Schema::Mutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: true

    def resolve(id:)
      unless context[:current_user]
        return { success: false, errors: ['Unauthorized'] }
      end

      post = WpPost.find(id)
      unless post
        return { success: false, errors: ['Post not found'] }
      end

      service = PostService.new(current_user: context[:current_user])
      result = service.destroy(post)

      if result[:success]
        { success: true, errors: [] }
      else
        { success: false, errors: [result[:error]] }
      end
    end
  end
end
