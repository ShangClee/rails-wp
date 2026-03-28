class PagesController < ApplicationController
  def show
    @page = WpPost.published.pages.find_by!(post_name: params[:slug])
  end
end
