module Mutations
  class UpdateUserRole < GraphQL::Schema::Mutation
    argument :id, ID, required: true
    argument :role, String, required: true

    field :user, Types::WpUserType, null: true
    field :errors, [String], null: true

    def resolve(id:, role:)
      unless context[:current_user]&.admin?
        return { user: nil, errors: ['Unauthorized'] }
      end

      user = WpUser.find_by(ID: id)
      return { user: nil, errors: ['User not found'] } unless user

      service = UserRoleService.new(user: user, role: role)
      result = service.assign_role

      if result[:success]
        { user: user, errors: [] }
      else
        { user: nil, errors: [result[:error]] }
      end
    end
  end
end
