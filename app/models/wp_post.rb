class WpPost < ApplicationRecord
  self.table_name = 'wp_posts'
  self.primary_key = 'ID'

  # Associations
  belongs_to :author, class_name: 'WpUser', foreign_key: 'post_author', optional: true
  has_many :metas, class_name: 'WpPostmeta', foreign_key: 'post_id', dependent: :destroy
  has_many :comments, class_name: 'WpComment', foreign_key: 'comment_post_ID', dependent: :destroy
  
  # Term Relationships
  has_many :term_relationships, class_name: 'WpTermRelationship', foreign_key: 'object_id'
  has_many :term_taxonomies, through: :term_relationships, source: :term_taxonomy
  has_many :terms, through: :term_taxonomies

  # Validations
  validates :post_title, presence: true
  validates :post_status, presence: true, length: { maximum: 20 }
  validates :post_name, length: { maximum: 200 }
  
  # Scopes
  scope :published, -> { where(post_status: 'publish') }
  scope :pages, -> { where(post_type: 'page') }
  scope :posts, -> { where(post_type: 'post') }
  scope :by_type, ->(type) { where(post_type: type) }
  scope :recent, -> { order(post_date: :desc) }

  # Callbacks
  before_validation :set_defaults, on: :create

  private

  def set_defaults
    self.post_date ||= Time.now
    self.post_date_gmt ||= Time.now.utc
    self.post_modified ||= Time.now
    self.post_modified_gmt ||= Time.now.utc
    self.post_content ||= ''
    self.post_excerpt ||= ''
    self.post_content_filtered ||= ''
    self.to_ping ||= ''
    self.pinged ||= ''
    self.post_mime_type ||= ''
    self.guid ||= ''
    self.comment_status ||= 'open'
    self.ping_status ||= 'open'
    self.menu_order ||= 0
    self.post_parent ||= 0
    self.comment_count ||= 0
  end

  public

  # Helper methods
  def get_meta(key)
    metas.find_by(meta_key: key)&.meta_value
  end
end
