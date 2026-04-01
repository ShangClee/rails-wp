module WordpressSerializer
  extend ActiveSupport::Concern

  def to_wordpress_format(collection_info = nil, embed: false)
    base_data = {
      id: @object.ID,
      date: @object.post_date.strftime("%Y-%m-%d %H:%M:%S"),
      date_gmt: @object.post_date_gmt.strftime("%Y-%m-%d %H:%M:%S"),
      guid: {
        rendered: @object.guid
      },
      modified: @object.post_modified.strftime("%Y-%m-%d %H:%M:%S"),
      modified_gmt: @object.post_modified_gmt.strftime("%Y-%m-%d %H:%M:%S"),
      slug: @object.post_name,
      status: @object.post_status,
      type: @object.post_type,
      link: Rails.application.routes.url_helpers.post_url(@object, host: ENV.fetch("SITE_URL", "http://localhost:8888")),
      title: {
        rendered: ApplicationController.helpers.simple_format(@object.post_title),
        raw: @object.post_title
      },
      content: {
        rendered: ApplicationController.helpers.simple_format(@object.post_content),
        raw: @object.post_content,
        protected: false
      },
      excerpt: {
        rendered: ApplicationController.helpers.simple_format(@object.post_excerpt),
        raw: @object.post_excerpt
      },
      author: @object.author&.ID || 0,
      featured_media: 0,
      comment_status: @object.comment_status,
      ping_status: @object.ping_status,
      format: "standard",
      meta: @object.metas.each_with_object({}) do |meta, hash|
        hash[meta.meta_key] = meta.meta_value
      end,
      categories: @object.term_taxonomies.categories.map do |tax|
        {
          id: tax.term.term_id,
          name: tax.term.name,
          slug: tax.term.slug,
          taxonomy: "category"
        }
      end,
      tags: @object.term_taxonomies.tags.map do |tax|
        {
          id: tax.term.term_id,
          name: tax.term.name,
          slug: tax.term.slug,
          taxonomy: "post_tag"
        }
      end
    }

    if embed
      base_data[:_embedded] = {}

      if @object.author
        base_data[:_embedded][:author] = [ {
          id: @object.author.ID,
          name: @object.author.display_name,
          url: "",
          description: "",
          link: Rails.application.routes.url_helpers.api_v2_user_url(@object.author.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")),
          slug: "",
          avatar_urls: { "24" => "", "48" => "", "96" => "" },
          meta: [],
          _links: {
            self: [ { href: Rails.application.routes.url_helpers.api_v2_user_url(@object.author.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")) } ]
          }
        } ]
      end

      base_data[:_embedded][:replies] = [ {
        href: Rails.application.routes.url_helpers.api_v2_comments_url(post: @object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")),
        embeddable: true,
        taxonomy: false
      } ]

      base_data[:_embedded][:"version-history"] = [ {
        href: Rails.application.routes.url_helpers.api_v2_post_revisions_url(@object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")),
        embeddable: true
      } ]

      base_data[:_embedded][:"wp:featuredmedia"] = [ {
        embeddable: true,
        href: Rails.application.routes.url_helpers.api_v2_media_url(0, host: ENV.fetch("SITE_URL", "http://localhost:8888")),
        taxonomy: false
      } ]

      base_data[:_embedded][:"wp:attachment"] = [ {
        href: Rails.application.routes.url_helpers.api_v2_media_url(post: @object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")),
        embeddable: true,
        taxonomy: false
      } ]

      unless @object.term_taxonomies.categories.empty?
        base_data[:_embedded][:"wp:term"] = []
        @object.term_taxonomies.categories.each do |tax|
          base_data[:_embedded][:"wp:term"] << {
            taxonomy: "category",
            embeddable: true,
            href: Rails.application.routes.url_helpers.api_v2_categories_url(post: @object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")),
            name: tax.term.name,
            slug: tax.term.slug,
            term_group: 0,
            term_taxonomy_id: tax.term_taxonomy_id,
            term_id: tax.term.term_id
          }
        end
      end

      unless @object.term_taxonomies.tags.empty?
        base_data[:_embedded][:"wp:term"] ||= []
        @object.term_taxonomies.tags.each do |tax|
          base_data[:_embedded][:"wp:term"] << {
            taxonomy: "post_tag",
            embeddable: true,
            href: Rails.application.routes.url_helpers.api_v2_tags_url(post: @object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")),
            name: tax.term.name,
            slug: tax.term.slug,
            term_group: 0,
            term_taxonomy_id: tax.term_taxonomy_id,
            term_id: tax.term.term_id
          }
        end
      end
    end

    if collection_info
      base_data[:_links] = {
        self: [ { href: paginated_collection_url(collection_info) } ],
        collection: [ { href: Rails.application.routes.url_helpers.api_v2_posts_url(host: ENV.fetch("SITE_URL", "http://localhost:8888")) } ],
        about: [ { href: Rails.application.routes.url_helpers.api_v2_post_type_url("post", host: ENV.fetch("SITE_URL", "http://localhost:8888")) } ],
        author: [ { href: Rails.application.routes.url_helpers.api_v2_user_url(@object.author&.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")), embeddable: true } ],
        replies: [ { href: Rails.application.routes.url_helpers.api_v2_comments_url(post: @object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")), embeddable: true } ],
        "version-history": [ { href: Rails.application.routes.url_helpers.api_v2_post_revisions_url(@object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")) } ],
        "wp:featuredmedia": [ { embeddable: true, href: Rails.application.routes.url_helpers.api_v2_media_url(0, host: ENV.fetch("SITE_URL", "http://localhost:8888")) } ],
        "wp:attachment": [ { href: Rails.application.routes.url_helpers.api_v2_media_url(post: @object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")), embeddable: true } ],
        "wp:term": [
          { taxonomy: "category", embeddable: true, href: Rails.application.routes.url_helpers.api_v2_categories_url(post: @object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")) },
          { taxonomy: "post_tag", embeddable: true, href: Rails.application.routes.url_helpers.api_v2_tags_url(post: @object.ID, host: ENV.fetch("SITE_URL", "http://localhost:8888")) }
        ],
        curies: [ { name: "wp", href: "https://api.w.org/{rel}", templated: true } ]
      }
    end

    base_data
  end

  private

  def paginated_collection_url(collection_info)
    params = collection_info[:params].dup
    base_url = Rails.application.routes.url_helpers.api_v2_posts_url(host: ENV.fetch("SITE_URL", "http://localhost:8888"))
    params.delete(:page)
    query_string = params.to_query
    query_string = "?#{query_string}" unless query_string.empty?
    "#{base_url}#{query_string}"
  end
end
