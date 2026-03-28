class WpCommentSerializer
  include JSONAPI::Serializer

  set_id :comment_ID
  set_type :comment

  attributes :comment_author, :comment_author_email, :comment_content, :comment_date,
             :comment_approved, :comment_parent

  attribute :post_id do |object|
    object.comment_post_ID
  end

  attribute :user_id do |object|
    object.user_id
  end

  attribute :author_name do |object|
    object.user ? object.user.display_name : object.comment_author
  end

  attribute :meta do |object|
    object.metas.each_with_object({}) do |meta, hash|
      hash[meta.meta_key] = meta.meta_value unless meta.meta_key.start_with?('_')
    end
  end
end
