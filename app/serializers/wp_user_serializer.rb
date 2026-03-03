class WpUserSerializer
  include JSONAPI::Serializer

  set_id :ID
  set_type :user

  attributes :user_login, :user_nicename, :user_email, :display_name, :user_registered, :user_url

  attribute :roles do |object|
    object.role
  end

  attribute :meta do |object|
    object.metas.each_with_object({}) do |meta, hash|
      hash[meta.meta_key] = meta.meta_value unless meta.meta_key.start_with?('_')
    end
  end
end
