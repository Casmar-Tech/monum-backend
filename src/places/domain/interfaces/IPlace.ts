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
	) => IPlaceTranslated;
}

export interface IPlaceTranslated
	extends Omit<IPlace, 'address' | 'description' | 'photos'> {
	address: IAddressTranslated;
	description?: string;
	photos?: string[];
}
