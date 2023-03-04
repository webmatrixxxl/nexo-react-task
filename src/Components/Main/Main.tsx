import { FC } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import ExchangesList from '../AssetList/AssetList';

const Main: FC = () => {
  const routes = [
    {
      path: '/',
      element: <Navigate replace to={`/price`} />,
    },
    {
      path: '/',
      element: (
        <>
          <main>
            <Outlet />
          </main>
        </>
      ),
      children: [
        {
          path: '/price/',
          element: <ExchangesList />,
          children: [
            {
              path: '/price/:pair',
              children: [
                {
                  path: '/price/:pair/:exchange/details',
                },
              ],
            },
          ],
        },
        {
          path: '*',
          element: <Navigate replace to={`/price`} />,
        },
      ],
    },
    {
      path: '*',
      element: <Navigate replace to={`/`} />,
    },
  ];

  const RoutesElement = useRoutes(routes);
  return <>{RoutesElement}</>;
};

export default Main;
