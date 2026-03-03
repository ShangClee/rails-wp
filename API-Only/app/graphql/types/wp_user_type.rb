module Types
  class WpUserType < Types::BaseObject
    field :ID, ID, null: false
    field :user_login, String, null: false
    field :user_nicename, String, null: true
    field :user_email, String, null: false
    field :display_name, String, null: true
    field :user_url, String, null: true
    field :role, String, null: true
    
    field :posts, [Types::WpPostType], null: true
    
    def role
      object.role
    end
  end
end
