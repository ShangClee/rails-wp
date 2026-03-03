Rails.application.routes.draw do
  mount Rswag::Ui::Engine => '/api-docs'
  mount Rswag::Api::Engine => '/api-docs'
  post "/graphql", to: "graphql#execute"
  devise_for :wp_users, path: 'api/v2', path_names: {
    sign_in: 'login',
    sign_out: 'logout',
    registration: 'register'
  },
  controllers: {
    sessions: 'api/v2/sessions',
    registrations: 'api/v2/registrations'
  },
  defaults: { format: :json }

  namespace :api do
    namespace :v2 do
      resources :posts
      resources :users, only: [:index, :show, :update] do
        collection do
          get 'me'
        end
      end
    end
  end

  namespace :rails do
    get "health", to: "health#show"
  end
  get "up" => "rails/health#show", as: :rails_health_check

  root "posts#index"
  resources :posts, only: [:index, :show]
end
