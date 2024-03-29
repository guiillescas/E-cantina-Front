import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import {
  FiArrowLeft,
  FiCalendar,
  FiCreditCard,
  FiHash,
  FiLock,
  FiPlus,
  FiSave,
  FiTag,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-toastify';

import BaseDashboard from '../components/BaseDashboard';
import InputWithMask from '../components/Inputs/InputWithMask';
import Input from '../components/Inputs/Input';
import Button from '../components/Button';
import SelectCreditCard from '../components/SelectCreditCard';

import { withSSRAuth } from '../utils/withSSRAuth';
import getvalidationErrors from '../utils/getValidationErrors';
import { formatPrice } from '../utils/formatPriceToBR';

import { useCart } from '../hooks/cart';
import { useAuth } from '../hooks/auth';

import { api } from '../services/apiClient';

import { StylesContainer } from '../styles/Pages/Checkout';
import ButtonWithIcon from '../components/ButtonWithIcon';

interface IAddCreditCardFormData {
  nickname: string;
  owner: string;
  cardNumber: string;
  validThru: string;
  cvv: string;
  cpfClient: string;
}

interface ICreditCardData {
  id: number;
  nickname: string;
  owner: string;
  cardNumber: string;
  validThru: string;
  cvv: string;
}

const Checkout = (): ReactElement => {
  const { user } = useAuth();
  const { cart, totalCartPrice, discount, discountId, clearCart } = useCart();

  const router = useRouter();

  const addCreditCardFormRef = useRef<FormHandles>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [userCreditCards, setUserCreditCards] = useState<ICreditCardData[]>([]);
  const [isUserAddingCard, setIsUserAddingCard] = useState(false);
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<number>();

  useEffect(() => {
    api
      .get(`/client/${user.sub}`)
      .then(response => {
        setUserCreditCards(response.data.cards);
      })
      .catch(error => {
        console.log(error);
      });
  }, [user]);

  const handleCheckoutSubmit = useCallback(async () => {
    setIsLoading(true);

    try {
      if (!selectedCreditCardId) {
        setIsLoading(false);
        return toast.error('Você deve selecionar um método de pagamento');
      }

      const orderData = {
        clientId: Number(user.sub),
        restaurantId: cart[0].restaurantId,
        discountId,
        observation: null,
        productList: cart.map(product => {
          return {
            productId: product.id,
            quantity: product.amount,
            description: product.observation,
          };
        }),
      };

      api
        .post('/order', orderData)
        .then(() => {
          toast.success('Pedido realizado com sucesso');
          clearCart();
          router.push('/orders');
        })
        .catch(error => {
          toast.error(error);
        });
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }, [cart, clearCart, discountId, router, selectedCreditCardId, user]);

  const handleAddCreditCard = useCallback(
    async (data: IAddCreditCardFormData) => {
      setIsLoading(true);
      try {
        addCreditCardFormRef.current?.setErrors({});

        const schema = Yup.object().shape({
          nickname: Yup.string().required('Apelido obrigatório'),
          owner: Yup.string().required('Nome no cartão obrigatório'),
          cardNumber: Yup.string().required('Número do cartão obrigatório'),
          validThru: Yup.string().required(
            'Data de validade do cartão obrigatória',
          ),
          cvv: Yup.string().required('CVV do cartão obrigatório'),
          cpfClient: Yup.string().required('CPF do titular obrigatório'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const creditCardData = {
          nickname: data.nickname,
          owner: data.owner,
          cardNumber: data.cardNumber.replaceAll('-', ''),
          validThru: `28/${data.validThru.slice(
            0,
            -3,
          )}/20${data.validThru.slice(-2)}`,
          cvv: data.cvv,
          bank: data.nickname,
          cpfClient: data.cpfClient,
        };

        api
          .post('/card', creditCardData)
          .then(response => {
            toast.success('Cartão adicionado com sucesso');
            setUserCreditCards([...userCreditCards, response.data]);
            addCreditCardFormRef.current.reset();
          })
          .catch(error => {
            return toast.error(error.response.daat.message);
          });
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          const errors = getvalidationErrors(error);

          addCreditCardFormRef.current?.setErrors(errors);
        }
      }
      setIsUserAddingCard(false);
      setIsLoading(false);
    },
    [userCreditCards],
  );

  return (
    <BaseDashboard>
      <StylesContainer>
        <Link href="/cart">
          <div className="back-button">
            <FiArrowLeft />
            <p>Voltar</p>
          </div>
        </Link>

        <h1>Pagamento</h1>

        <div className="resume">
          <div className="card-area">
            <div className="card-area-title">
              <h2>Meus cartões</h2>

              {isUserAddingCard ? (
                <a role="button" onClick={() => setIsUserAddingCard(false)}>
                  <FiX />
                  Cancelar
                </a>
              ) : (
                <a role="button" onClick={() => setIsUserAddingCard(true)}>
                  <FiPlus />
                  Adicionar cartão
                </a>
              )}
            </div>

            <div className="cards">
              {userCreditCards.map(userCreditCard => (
                <SelectCreditCard
                  key={userCreditCard.id}
                  id={userCreditCard.id}
                  nickname={userCreditCard.nickname}
                  cardNumber={userCreditCard.cardNumber}
                  selected={selectedCreditCardId === userCreditCard.id}
                  setSelectedCreditCardId={setSelectedCreditCardId}
                />
              ))}
            </div>

            {userCreditCards.length === 0 && (
              <p className="no-cards">
                Você não possui nenhum cartão cadastrado :(
              </p>
            )}

            {isUserAddingCard && (
              <Form ref={addCreditCardFormRef} onSubmit={handleAddCreditCard}>
                <div className="card-title">
                  <h2>Informações sobre pagamento</h2>

                  <ButtonWithIcon
                    type="button"
                    icon={FiSave}
                    isSuccess
                    onClick={() => addCreditCardFormRef.current.submitForm()}
                  >
                    Salvar
                  </ButtonWithIcon>
                </div>

                <Input
                  name="nickname"
                  icon={FiTag}
                  label="Apelido do cartão"
                  placeholder="Apelido do cartão"
                />
                <InputWithMask
                  name="cpfClient"
                  icon={FiCreditCard}
                  label="CPF do titular do cartão"
                  placeholder="CPF do titular do cartão"
                  mask="999.999.999-99"
                />
                <Input
                  name="owner"
                  icon={FiUser}
                  label="Nome no cartão"
                  placeholder="Nome no cartão"
                  isInUppercase
                />
                <InputWithMask
                  name="cardNumber"
                  icon={FiHash}
                  label="Número no cartão"
                  placeholder="Número no cartão"
                  mask="9999-9999-9999-9999"
                />
                <div className="inline-inputs">
                  <InputWithMask
                    name="validThru"
                    icon={FiCalendar}
                    label="Data de validade"
                    placeholder="Data de validade"
                    mask="99/99"
                  />
                  <Input
                    name="cvv"
                    icon={FiLock}
                    label="CVV"
                    placeholder="CVV"
                  />
                </div>
              </Form>
            )}
          </div>

          <div>
            <h2>Resumo da compra</h2>

            <table>
              <tr>
                <th>Total de itens:</th>
                <td>{cart.length}</td>
              </tr>
              <tr>
                <th>Desconto:</th>
                <td>{formatPrice(Number(discount))}</td>
              </tr>
              <tr>
                <th>Preço final:</th>
                <td>{formatPrice(Number(totalCartPrice()))}</td>
              </tr>
            </table>

            <Button
              className="checkout-button"
              onClick={handleCheckoutSubmit}
              isLoading={isLoading}
            >
              Finalizar pedido
            </Button>
          </div>
        </div>
      </StylesContainer>
    </BaseDashboard>
  );
};

export default Checkout;

export const getServerSideProps = withSSRAuth(async () => {
  return {
    props: {},
  };
});
