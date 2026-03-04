class WpCommentmeta < ApplicationRecord
  self.table_name = 'wp_commentmeta'
  self.primary_key = 'meta_id'

  belongs_to :comment, class_name: 'WpComment', foreign_key: 'comment_id'

  validates :meta_key, presence: true, length: { maximum: 255 }
end
