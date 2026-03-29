module Mutations
  class DeletePage < GraphQL::Schema::Mutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: true

    def resolve(id:)
      user = context[:current_user]
      unless user&.admin? || user&.editor?
        return { success: false, errors: ['Unauthorized'] }
      end

      page = WpPost.pages.find_by(ID: id)
      return { success: false, errors: ['Page not found'] } unless page

      if page.destroy
        { success: true, errors: [] }
      else
        { success: false, errors: ['Failed to delete page'] }
      end
    end
  end
end
