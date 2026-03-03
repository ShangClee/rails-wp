class PostsController < WebController
  def index
    @posts = WpPost.published.recent.limit(10)
  end

  def show
    @post = WpPost.published.find(params[:id])
  end
end
