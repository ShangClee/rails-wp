class WpUser < ApplicationRecord
  self.table_name = 'wp_users'
  self.primary_key = 'ID'

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: Devise::JWT::RevocationStrategies::Null

  has_many :metas, class_name: 'WpUsermeta', foreign_key: 'user_id', dependent: :destroy
  has_many :posts, class_name: 'WpPost', foreign_key: 'post_author'
  has_many :comments, class_name: 'WpComment', foreign_key: 'user_id'

  validates :user_login, presence: true, uniqueness: true, length: { maximum: 60 }
  validates :user_email, presence: true, uniqueness: true, length: { maximum: 100 }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :user_nicename, presence: true, length: { maximum: 50 }
  
  # Map Devise fields to WordPress fields
  alias_attribute :email, :user_email
  alias_attribute :encrypted_password, :user_pass
  alias_attribute :created_at, :user_registered

  include WpAuthenticatable

  # Helper to get meta value
  def get_meta(key)
    metas.find_by(meta_key: key)&.meta_value
  end

  # Devise overrides
  def email_required?
    true
  end

  def active_for_authentication?
    true
  end

  def will_save_change_to_email?
    false
  end
end
