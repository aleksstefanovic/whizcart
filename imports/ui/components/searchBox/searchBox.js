import angular from 'angular'
import angularMeteor from 'angular-meteor';
import template from './searchBox.html';
import {Items} from '../../../api/items/index';
import { Meteor } from 'meteor/meteor';

class SearchBox{
	constructor($stateParams){

	}
}

const name = 'searchBox';

export default angular.module(name, [angularMeteor])
	.component(name,{
		template,
		controllerAs: name,
		controller: SearchBox
	});