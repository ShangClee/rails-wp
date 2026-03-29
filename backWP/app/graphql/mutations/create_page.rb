module Mutations
  class CreatePage < GraphQL::Schema::Mutation
    argument :title, String, required: true
    argument :content, String, required: false
    argument :excerpt, String, required: false
    argument :status, String, required: false
    argument :parent_id, Integer, required: false

    field :page, Types::WpPageType, null: true
    field :errors, [String], null: true

    def resolve(title:, content: '', excerpt: '', status: 'draft', parent_id: 0)
      user = context[:current_user]
      unless user&.admin? || user&.editor?
        return { page: nil, errors: ['Unauthorized'] }
      end

      page = WpPost.new(
        post_title: title,
        post_content: content,
        post_excerpt: excerpt,
        post_status: status,
        post_parent: parent_id || 0,
        post_author: user.ID,
        post_type: 'page',
        post_date: Time.now,
        post_date_gmt: Time.now.utc,
        post_modified: Time.now,
        post_modified_gmt: Time.now.utc,
        comment_status: 'closed',
        ping_status: 'closed',
        to_ping: '',
        pinged: '',
        post_content_filtered: ''
      )

      if page.save
        { page: page, errors: [] }
      else
        { page: nil, errors: page.errors.full_messages }
      end
    end
  end
end
