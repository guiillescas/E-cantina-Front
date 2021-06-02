import { ReactElement } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useProductModal } from '../../hooks/productModal';

import { formatPrice } from '../../utils/formatPriceToBR';
import ProductModal from '../Modals/ProductModal';

import { StylesContainer } from './styles';

interface IProductProps {
  id: number;
  type: string;
  name: string;
  description: string;
  price: number;
  urlImage?: string;
  amount: number;
  observation?: string;
  cartItemId: number;
}

interface IProductCardProps {
  product: IProductProps;
}

const ProductCard = ({ product }: IProductCardProps): ReactElement => {
  const {
    productModalIsOpen,
    closeProductModal,
    setModalProductIsOpen,
  } = useProductModal();

  return (
    <StylesContainer>
      <ProductModal
        isModalOpen={productModalIsOpen}
        onRequestClose={closeProductModal}
        setModalProductIsOpen={setModalProductIsOpen}
        product={product}
      />

      <img
        src="/assets/hamburger.jpeg"
        alt={`Imagem de ${product && product.name}`}
      />
      <h2>{product && product.name}</h2>
      <p>{product && product.description}</p>
      <span>{formatPrice(product && product.price)}</span>

      <button type="button" onClick={() => setModalProductIsOpen(true)}>
        <FiPlus />
        <p>Ver mais</p>
      </button>
    </StylesContainer>
  );
};

export default ProductCard;
