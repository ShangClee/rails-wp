class WpPostmeta < ApplicationRecord
  self.table_name = 'wp_postmeta'
  self.primary_key = 'meta_id'

  belongs_to :post, class_name: 'WpPost', foreign_key: 'post_id'

  validates :meta_key, presence: true, length: { maximum: 255 }
end
