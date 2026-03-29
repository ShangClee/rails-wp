class ApplicationController < ActionController::Base
  # Alias Devise helpers to match generic user terminology
  def current_user
    current_wp_user
  end

  def authenticate_user!
    authenticate_wp_user!
  end

  def user_signed_in?
    wp_user_signed_in?
  end
end
