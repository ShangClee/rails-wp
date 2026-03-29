module Mutations
  class UpdatePage < GraphQL::Schema::Mutation
    argument :id, ID, required: true
    argument :title, String, required: false
    argument :content, String, required: false
    argument :excerpt, String, required: false
    argument :status, String, required: false
    argument :parent_id, Integer, required: false

    field :page, Types::WpPageType, null: true
    field :errors, [String], null: true

    def resolve(id:, title: nil, content: nil, excerpt: nil, status: nil, parent_id: nil)
      user = context[:current_user]
      unless user&.admin? || user&.editor?
        return { page: nil, errors: ['Unauthorized'] }
      end

      page = WpPost.pages.find_by(ID: id)
      return { page: nil, errors: ['Page not found'] } unless page

      params = {}
      params[:post_title] = title if title.present?
      params[:post_content] = content if content.present?
      params[:post_excerpt] = excerpt if excerpt.present?
      params[:post_status] = status if status.present?
      params[:post_parent] = parent_id unless parent_id.nil?
      params[:post_modified] = Time.now
      params[:post_modified_gmt] = Time.now.utc

      if page.update(params)
        { page: page, errors: [] }
      else
        { page: nil, errors: page.errors.full_messages }
      end
    end
  end
end
