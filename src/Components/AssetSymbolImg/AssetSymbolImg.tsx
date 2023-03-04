import { FC } from 'react';

interface AssetSymbolImgProps {
  assetSymbol?: string;
  className?: string;
}

export const AssetSymbolImg: FC<AssetSymbolImgProps> = ({
  assetSymbol = '',
  className = '',
}) => {
  /**
   *  This is an external service to display asset icons.
   *  If not assetSymbol is provided, the component will return an empty image.
   *  This is important to keep the layout consistent. Otherwise, the layout will
   *  jump when the image is loaded or missing. The images are lazy loaded.
   * */

  const imgSrc = assetSymbol
    ? `https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/${assetSymbol.toLowerCase()}.svg`
    : 'data:,';

  return (
    <img
      alt={assetSymbol}
      className={`asset-symbol-img w-4 h-4 pointer-events-none ${
        !assetSymbol && 'invisible'
      } ${className}`}
      loading="lazy"
      src={imgSrc}
    />
  );
};
