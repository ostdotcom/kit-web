module CompanyApi

  module Response

    module Entity

      class SignMessages

        # Initialize
        #
        # * Author: Puneet
        # * Date: 02/02/2018
        # * Reviewed By:
        #
        # @param [Hash] data (mandatory) - entity data
        #
        # @return [CompanyApi::Response::Entity::TokenSupplyDetails] returns an object of CompanyApi::Response::Entity::TokenSupplyDetails class
        #
        def initialize(data)
          @data = data
        end

        def data
          @data
        end

        def wallet_association
          @data['wallet_association']
        end

      end

    end

  end

end
