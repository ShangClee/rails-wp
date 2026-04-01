class PostService
  def initialize(current_user:)
    @current_user = current_user
  end

  def create(params)
    return { success: false, error: "Unauthorized" } unless can_create?

    post = WpPost.new(params.slice(:post_title, :post_content, :post_excerpt, :post_status, :post_name))
    post.post_author = @current_user.ID
    post.post_date = TimezoneUtility.now_local
    post.post_date_gmt = TimezoneUtility.now_utc
    post.post_modified = TimezoneUtility.now_local
    post.post_modified_gmt = TimezoneUtility.now_utc
    post.post_type = "post"
    post.comment_status = "open"
    post.ping_status = "open"
    post.to_ping = ""
    post.pinged = ""
    post.post_content_filtered = ""

    if post.save
      { success: true, post: post }
    else
      { success: false, error: post.errors.full_messages.join(", ") }
    end
  end

  def update(post, params)
    return { success: false, error: "Unauthorized" } unless can_edit?(post)

    save_revision(post)

    post.post_modified = TimezoneUtility.now_local
    post.post_modified_gmt = TimezoneUtility.now_utc

    if post.update(params.slice(:post_title, :post_content, :post_excerpt, :post_status, :post_name))
      { success: true, post: post }
    else
      { success: false, error: post.errors.full_messages.join(", ") }
    end
  end

  def destroy(post)
    return { success: false, error: "Unauthorized" } unless can_delete?(post)

    if post.destroy
      { success: true }
    else
      { success: false, error: "Failed to delete post" }
    end
  end

  private

  def can_create?
    @current_user.admin? || @current_user.editor? || @current_user.author?
  end

  def can_edit?(post)
    return true if @current_user.admin? || @current_user.editor?
    return true if @current_user.author? && post.post_author == @current_user.ID
    false
  end

  def can_delete?(post)
    can_edit?(post)
  end

  def save_revision(post)
    now = TimezoneUtility.now_local
    WpPost.create!(
      post_author: post.post_author,
      post_date: now,
      post_date_gmt: TimezoneUtility.now_utc,
      post_modified: now,
      post_modified_gmt: TimezoneUtility.now_utc,
      post_content: post.post_content,
      post_title: post.post_title,
      post_excerpt: post.post_excerpt,
      post_status: "inherit",
      post_name: "#{post.ID}-revision-v1",
      post_type: "revision",
      post_parent: post.ID,
      comment_status: "closed",
      ping_status: "closed",
      to_ping: "",
      pinged: "",
      post_content_filtered: "",
      guid: "",
      menu_order: 0,
      post_mime_type: ""
    )
  rescue => e
    Rails.logger.warn("Failed to save revision for post #{post.ID}: #{e.message}")
  end
end
