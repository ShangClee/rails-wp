class WpComment < ApplicationRecord
  self.table_name = 'wp_comments'
  self.primary_key = 'comment_ID'

  belongs_to :post, class_name: 'WpPost', foreign_key: 'comment_post_ID'
  belongs_to :user, class_name: 'WpUser', foreign_key: 'user_id', optional: true
  
  has_many :metas, class_name: 'WpCommentmeta', foreign_key: 'comment_id', dependent: :destroy
  
  # Hierarchy
  belongs_to :parent_comment, class_name: 'WpComment', foreign_key: 'comment_parent', optional: true
  has_many :children, class_name: 'WpComment', foreign_key: 'comment_parent'

  validates :comment_content, presence: true
  validates :comment_author, presence: true
  validates :comment_author_email, length: { maximum: 100 }
  
  scope :approved, -> { where(comment_approved: '1') }
end
