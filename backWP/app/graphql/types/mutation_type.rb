# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :create_post, mutation: Mutations::CreatePost
    field :update_post, mutation: Mutations::UpdatePost
    field :delete_post, mutation: Mutations::DeletePost
    field :create_page, mutation: Mutations::CreatePage
    field :update_page, mutation: Mutations::UpdatePage
    field :delete_page, mutation: Mutations::DeletePage
    field :update_user_role, mutation: Mutations::UpdateUserRole
  end
end
