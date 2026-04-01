class CreateCommentService
  def initialize(post_id:, params:, user: nil, ip_address: nil, user_agent: nil)
    @post_id = post_id
    @params = params
    @user = user
    @ip_address = ip_address || "127.0.0.1"
    @user_agent = user_agent || ""
  end

  def call
    ActiveRecord::Base.transaction do
      post = WpPost.find(@post_id)

      # Validate post exists and accepts comments
      unless post.comment_status == "open"
        return { success: false, error: "This post does not accept comments" }
      end

      # Build comment
      comment = WpComment.new(
        comment_post_ID: @post_id,
        comment_author: @params[:comment_author] || (@user ? @user.display_name : "Anonymous"),
        comment_author_email: @params[:comment_author_email] || (@user ? @user.user_email : ""),
        comment_author_url: @params[:comment_author_url] || "",
        comment_content: @params[:comment_content],
        comment_author_IP: @ip_address,
        comment_agent: @user_agent,
        comment_type: "comment",
        comment_parent: @params[:comment_parent].to_i || 0,
        user_id: @user ? @user.ID : 0,
        comment_date: TimezoneUtility.now_local,
        comment_date_gmt: TimezoneUtility.now_utc
      )

      # Set approval status following WordPress defaults:
      # - Admins/editors always auto-approve
      # - Authenticated users auto-approve unless comment_moderation option is on
      # - Guests always go to moderation
      comment.comment_approved = resolve_approval_status

      unless comment.save
        return { success: false, error: comment.errors.full_messages.join(", ") }
      end

      # Increment comment count only for approved comments (matches WordPress behavior)
      if comment.comment_approved == "1"
        post.increment!(:comment_count)
      end

      { success: true, comment: comment }
    end
  rescue => e
    { success: false, error: e.message }
  end

  private

  def resolve_approval_status
    return "1" if @user&.admin? || @user&.editor?

    moderation_required = WpOption.find_by(option_name: "comment_moderation")&.option_value == "1"
    return "0" if moderation_required

    @user ? "1" : "0"
  end
end
