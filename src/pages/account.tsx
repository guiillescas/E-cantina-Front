import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { Form } from '@unform/web';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { FormHandles } from '@unform/core';
import {
  FiAlertCircle,
  FiCreditCard,
  FiEdit2,
  FiLock,
  FiMail,
  FiUser,
} from 'react-icons/fi';

import LeftDashboardMenu from '../components/LeftDashboardMenu';
import SEO from '../components/SEO';
import TopDashboardMenu from '../components/TopDashboardMenu';
import Input from '../components/Inputs/Input';
import InputWithMask from '../components/Inputs/InputWithMask';
import ButtonWithIcon from '../components/ButtonWithIcon';
import Button from '../components/Button';
import Dropzone from '../components/Inputs/Dropzone';

import { withSSRAuth } from '../utils/withSSRAuth';
import getvalidationErrors from '../utils/getValidationErrors';

import { api } from '../services/apiClient';

import { useAuth } from '../hooks/auth';

import { StylesContainer, Content, ContentList } from '../styles/Pages/Account';

interface IUpdateUserInfosFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  cpf: string;
}

interface IUserResponse {
  email: string;
  name: string;
  type: string;
  cpf: string;
}

const Account = (): ReactElement => {
  const { user, updateUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isUserEditingFields, setIsUserEditingFields] = useState(false);
  const [userImageUrl, setUserImageUrl] = useState('');

  const formRef = useRef<FormHandles>(null);
  const uploadFileFormRef = useRef<FormHandles>(null);

  useEffect(() => {
    setUserImageUrl(user.urlImage);
  }, [user]);

  useEffect(() => {
    api
      .get(`/client/${user?.sub}`)
      .then(response => {
        const userData: IUserResponse = response.data;

        const separatedName = userData.name.split(' ');
        const formattedFirstName = separatedName[0];
        const formattedLastName = separatedName
          .filter(name => name !== separatedName[0])
          .toString()
          .replace(',', ' ');

        if (!userData.cpf) {
          formRef.current?.setData({
            firstName: formattedFirstName,
            lastName: formattedLastName,
            email: userData.email,
          });
        } else {
          formRef.current?.setData({
            firstName: formattedFirstName,
            lastName: formattedLastName,
            email: userData.email,
            cpf: userData.cpf,
          });
        }
      })
      .catch(() => {
        toast.error('Erro inesperado. Tente novamente mais tarde');
      });
  }, [user, updateUser]);

  const handleSignUpFormSubmit = useCallback(
    async (data: IUpdateUserInfosFormData) => {
      setIsLoading(true);
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          firstName: Yup.string().required('Nome obrigatório'),
          lastName: Yup.string().required('Sobrenome obrigatório'),
          email: Yup.string()
            .email('Por favor insira um e-mail válido')
            .required('E-mail obrigatório'),
          password: Yup.string().required('Senha obrigatória'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const userData = {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          cpf: data.cpf,
          password: data.password,
        };

        await updateUser({ dataOfUser: userData, setIsUserEditingFields });
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getvalidationErrors(err);

          formRef.current?.setErrors(errors);
        }
      }

      setIsLoading(false);
    },
    [updateUser],
  );

  async function handleFileUpload(data: any): Promise<void> {
    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append('image', data.image[0]);
      formData.append('userId', user.sub);

      console.log(data.image[0]);

      uploadFileFormRef.current?.setErrors({});

      const schema = Yup.object().shape({
        image: Yup.mixed().required('Nome obrigatório'),
      });

      await schema.validate(data, {
        abortEarly: false,
      });

      fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData,
      });

      toast.success('Imagem alterada com sucesso');
      uploadFileFormRef.current.clearField('image');
    } catch (err) {
      console.log(err);
      if (err instanceof Yup.ValidationError) {
        const errors = getvalidationErrors(err);

        formRef.current?.setErrors(errors);
      }
    }

    setIsLoading(false);
  }

  return (
    <StylesContainer>
      <SEO title="Minha conta" />
      <TopDashboardMenu setIsLoading={setIsLoading} />

      <Content>
        <LeftDashboardMenu />

        <ContentList>
          <div className="title">
            <h1>Informações pessoais</h1>
            <ButtonWithIcon
              type="button"
              icon={FiEdit2}
              onClick={() => setIsUserEditingFields(true)}
            >
              Editar informações
            </ButtonWithIcon>
          </div>

          <Form onSubmit={handleSignUpFormSubmit} ref={formRef}>
            <div className="inputs">
              <Input
                name="firstName"
                placeholder="Nome"
                label="Nome"
                icon={FiUser}
                disabled={!isUserEditingFields}
              />
              <Input
                name="lastName"
                placeholder="Sobrenome"
                label="Sobrenome"
                icon={FiUser}
                disabled={!isUserEditingFields}
              />
              <Input
                name="email"
                placeholder="E-mail"
                label="E-mail"
                icon={FiMail}
                disabled={!isUserEditingFields}
              />
              <InputWithMask
                name="cpf"
                placeholder="CPF"
                label="CPF"
                mask="999.999.999-99"
                icon={FiCreditCard}
                disabled={!isUserEditingFields}
              />
            </div>

            {isUserEditingFields && (
              <div className="finish-update-container">
                <span>
                  <FiAlertCircle size={18} />
                  Insira sua senha para salvar as alterações
                </span>
                <div className="finish-update-user-infos">
                  <Input
                    name="password"
                    type="password"
                    icon={FiLock}
                    label="Senha"
                  />

                  <Button type="submit" isLoading={isLoading}>
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </Form>

          <p className="upload-image-p">Altere sua imagem de perfil aqui</p>
          <Form
            ref={uploadFileFormRef}
            onSubmit={handleFileUpload}
            className="file-upload-form"
          >
            <div className="dropzone-area">
              <Dropzone name="image" />

              <div className="finish-update-container">
                <span>
                  <FiAlertCircle size={18} />
                  Insira sua senha para salvar as alterações
                </span>
                <div className="finish-update-user-infos">
                  <Input
                    name="password"
                    type="password"
                    icon={FiLock}
                    label="Senha"
                  />

                  <Button type="submit" isLoading={isLoading}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>

            <div className="user-image">
              {userImageUrl === '' ? (
                <FiUser />
              ) : (
                <img
                  src={`http://localhost:8080${userImageUrl}`}
                  alt={`Imagem de ${user && user.name}`}
                />
              )}
            </div>
          </Form>
        </ContentList>
      </Content>
    </StylesContainer>
  );
};

export default Account;

export const getServerSideProps = withSSRAuth(async () => {
  return {
    props: {},
  };
});
