import { Types } from 'mongoose';
import IPhoto from './IPhoto.js';
import { IAddress, IAddressTranslated } from './IAddress.js';

export interface IPlace {
	_id?: Types.ObjectId;
	id: string;
	name: string;
	nameTranslations: {
		[key: string]: string;
	};
	address: IAddress;
	description: {
		[key: string]: string;
	};
	importance: number;
	photos?: IPhoto[];
	mainPhoto?: IPhoto;
	rating?: number;
	googleId?: string;
	googleMapsUri?: string;
	internationalPhoneNumber: string;
	nationalPhoneNumber: string;
	types: string[];
	primaryType?: string;
	userRatingCount?: number;
	websiteUri?: string;
	createdAt: Date;
	updatedAt: Date;
	getTranslatedVersion: (
		language: string,
		imageSize?: string,
	) => Promise<IPlaceTranslated>;
}

export interface IPlaceTranslated
	extends Omit<IPlace, 'address' | 'description' | 'photos' | 'mainPhoto'> {
	address: IAddressTranslated;
	description?: string;
	photos?: string[];
	mainPhoto?: string;
}
