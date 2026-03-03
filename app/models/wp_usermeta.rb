class WpUsermeta < ApplicationRecord
  self.table_name = 'wp_usermeta'
  self.primary_key = 'umeta_id'

  belongs_to :user, class_name: 'WpUser', foreign_key: 'user_id'

  validates :meta_key, presence: true, length: { maximum: 255 }
end
