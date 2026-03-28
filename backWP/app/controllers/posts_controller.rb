class PostsController < ApplicationController
  def index
    @posts = WpPost.published.posts.includes(:author).recent.limit(20)
  end

  def show
    @post = WpPost.published.posts.find(params[:id])
    @comments = @post.comments.approved.includes(:user).order(comment_date: :asc)
  end
end
